import readline from 'readline';
import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase, isDbConnected } from '../config/database.js';
import { env } from '../config/env.js';
import { Category } from '../models/Category.js';
import { User } from '../models/User.js';
import { ROLES } from '../constants/roles.js';

const INITIAL_CATEGORIES = [
  {
    name: 'Electrical',
    slug: 'electrical',
    description: 'Electrical fixtures, lighting, switches, power sockets, and electrical supplies.'
  },
  {
    name: 'Plumbing',
    slug: 'plumbing',
    description: 'Water supply, drainage, restroom fixtures, and leakage.'
  },
  {
    name: 'Furniture',
    slug: 'furniture',
    description: 'Desks, chairs, whiteboards, podiums, doors, and carpentry.'
  },
  {
    name: 'Classroom Equipment',
    slug: 'classroom-equipment',
    description: 'Projectors, audio systems, smartboards, and classroom display equipment.'
  },
  {
    name: 'Laboratory Equipment',
    slug: 'laboratory-equipment',
    description: 'Lab instruments, ventilation hoods, test benches, and specialized tools.'
  },
  {
    name: 'Internet & Wi-Fi',
    slug: 'internet-wifi',
    description: 'Campus Wi-Fi connectivity, Ethernet LAN outlets, and network hardware.'
  },
  {
    name: 'Cleaning & Sanitation',
    slug: 'cleaning-sanitation',
    description: 'Janitorial needs, waste disposal, spill cleanup, and restroom sanitation.'
  },
  {
    name: 'Other',
    slug: 'other',
    description: 'Miscellaneous campus facility maintenance issues.'
  }
];

function promptQuestion(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

/**
 * Seeds or updates maintenance categories idempotently.
 */
export async function seedCategories() {
  console.log('[Seed] Seeding maintenance categories...');
  let createdCount = 0;
  let updatedCount = 0;

  for (const cat of INITIAL_CATEGORIES) {
    const existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      await Category.create(cat);
      createdCount++;
    } else {
      // Ensure name and description are up to date without altering custom flags
      existing.name = cat.name;
      existing.description = cat.description;
      await existing.save();
      updatedCount++;
    }
  }

  console.log(`[Seed] Categories processed: ${createdCount} created, ${updatedCount} verified/updated.`);
  return { createdCount, updatedCount, total: INITIAL_CATEGORIES.length };
}

/**
 * Securely creates a user account if it doesn't already exist.
 * Never overwrites passwords of existing accounts.
 */
export async function seedUserAccount({ name, email, password, role }) {
  if (!email || !password) {
    return { status: 'skipped', reason: 'Missing email or password' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    console.log(`[Seed] ${role} account (${normalizedEmail}) already exists. Existing credentials preserved.`);
    return { status: 'exists', user: existingUser };
  }

  if (password.length < 8) {
    throw new Error(`Password for ${normalizedEmail} must be at least 8 characters long.`);
  }

  // Hash password using bcryptjs with work factor of 12
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const newUser = await User.create({
    name: name || (role === ROLES.ADMIN ? 'Campus Administrator' : 'Campus Technician'),
    email: normalizedEmail,
    passwordHash,
    role,
    isActive: true
  });

  console.log(`[Seed] Created initial ${role} account: ${normalizedEmail}`);
  return { status: 'created', user: newUser };
}

/**
 * Main seeding execution workflow
 */
export async function runSeed(options = { interactive: false }) {
  console.log('--- FixLoop Database Seeder ---');

  await connectDatabase();

  if (!isDbConnected()) {
    throw new Error('Database connection is not active. Please ensure MongoDB is reachable.');
  }

  // 1. Seed Categories
  const categoryResult = await seedCategories();

  // 2. Seed Initial Admin Account
  let adminName = env.INITIAL_ADMIN_NAME;
  let adminEmail = env.INITIAL_ADMIN_EMAIL;
  let adminPassword = env.INITIAL_ADMIN_PASSWORD;

  if (options.interactive && !adminEmail) {
    console.log('\n--- Initial Admin Setup (Interactive) ---');
    adminEmail = await promptQuestion('Enter admin email (or press Enter to skip): ');
    if (adminEmail) {
      adminName = (await promptQuestion('Enter admin full name [Campus Administrator]: ')) || 'Campus Administrator';
      adminPassword = await promptQuestion('Enter admin password (min 8 chars): ');
    }
  }

  if (adminEmail && adminPassword) {
    await seedUserAccount({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: ROLES.ADMIN
    });
  } else {
    console.log('[Seed] No initial admin credentials configured (set INITIAL_ADMIN_EMAIL & INITIAL_ADMIN_PASSWORD to seed).');
  }

  // 3. Seed Initial Technician Account
  let techName = env.INITIAL_TECH_NAME;
  let techEmail = env.INITIAL_TECH_EMAIL;
  let techPassword = env.INITIAL_TECH_PASSWORD;

  if (options.interactive && !techEmail) {
    console.log('\n--- Initial Technician Setup (Interactive) ---');
    techEmail = await promptQuestion('Enter technician email (or press Enter to skip): ');
    if (techEmail) {
      techName = (await promptQuestion('Enter technician full name [Campus Technician]: ')) || 'Campus Technician';
      techPassword = await promptQuestion('Enter technician password (min 8 chars): ');
    }
  }

  if (techEmail && techPassword) {
    await seedUserAccount({
      name: techName,
      email: techEmail,
      password: techPassword,
      role: ROLES.TECHNICIAN
    });
  } else {
    console.log('[Seed] No initial technician credentials configured (set INITIAL_TECH_EMAIL & INITIAL_TECH_PASSWORD to seed).');
  }

  console.log('--- FixLoop Database Seeding Completed Successfully ---\n');
  return { categoryResult };
}

// Direct execution guard
const isDirectExecution = process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('scripts/seed.js');

if (isDirectExecution) {
  const isInteractive = process.argv.includes('--interactive') || process.argv.includes('-i');
  runSeed({ interactive: isInteractive })
    .then(async () => {
      await disconnectDatabase();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error(`[Seed Fatal Error]: ${error.message}`);
      await disconnectDatabase();
      process.exit(1);
    });
}

