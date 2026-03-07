import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Account from '../models/Account.js';
import Contact from '../models/Contact.js';
import Lead from '../models/Lead.js';
import Opportunity from '../models/Opportunity.js';
import Activity from '../models/Activity.js';
import Task from '../models/Task.js';

// Configuration
const SEED_USER_COUNT = 1;
const ACCOUNT_COUNT = 15;
const CONTACT_COUNT = 25;
const LEAD_COUNT = 20;
const OPPORTUNITY_COUNT = 12;
const ACTIVITY_COUNT = 30;
const TASK_COUNT = 15;

// Sample data pools
const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education', 'Real Estate', 'Consulting', 'Marketing', 'Transportation'];

const firstNames = ['James', 'Emma', 'Michael', 'Sophia', 'William', 'Olivia', 'Alexander', 'Ava', 'Benjamin', 'Isabella', 'Daniel', 'Mia', 'Henry', 'Charlotte', 'Sebastian', 'Amelia', 'Jack', 'Harper', 'Aiden', 'Evelyn', 'Ryan', 'Abigail', 'Nathan', 'Emily', 'Cameron', 'Elizabeth', 'David', 'Samantha', 'Kevin', 'Victoria'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const companyPrefixes = ['Tech', 'Global', 'Smart', 'Digital', 'Cloud', 'Data', 'Inno', 'Next', 'Future', 'Alpha', 'Beta', 'Prime', 'Elite', 'Apex', 'Core'];
const companySuffixes = ['Solutions', 'Systems', 'Technologies', 'Corp', 'Inc', 'Partners', 'Group', 'Industries', 'Ventures', 'Dynamics', 'Labs', 'Networks', 'Services', 'Consulting'];
const companyEndings = ['LLC', 'Inc', 'Corp', 'Ltd', ''];

const leadSources = ['Website', 'Referral', 'Trade Show', 'Cold Call', 'Advertisement', 'Other'];
const leadStatuses = ['New', 'Contacted', 'Qualified', 'Unqualified'];

const opportunityStages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const stageProbabilities = { 'Prospecting': 10, 'Qualification': 25, 'Proposal': 50, 'Negotiation': 75, 'Closed Won': 100, 'Closed Lost': 0 };

const activityTypes = ['Call', 'Email', 'Meeting', 'Note'];
const taskPriorities = ['Low', 'Normal', 'High'];
const taskStatuses = ['Not Started', 'In Progress', 'Completed', 'Deferred'];

const subjects = {
  Call: ['Follow-up call', 'Introduction call', 'Demo call', 'Check-in call', 'Discovery call'],
  Email: ['Follow-up email', 'Proposal sent', 'Introduction email', 'Thank you email', 'Newsletter response'],
  Meeting: ['Discovery meeting', 'Demo presentation', 'Contract signing', 'Quarterly review', 'Kickoff meeting'],
  Note: ['Meeting notes', 'Call summary', 'Important update', 'Reminder', 'Research findings']
};

const taskSubjects = ['Send proposal', 'Follow up with client', 'Prepare presentation', 'Update CRM records', 'Schedule meeting', 'Review contract', 'Send invoice', 'Call prospect', 'Research competitor', 'Update documentation', 'Team sync', 'Prepare demo', 'Client onboarding', 'Review proposal', 'Submit report'];

// Helper functions
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomEmail = (first, last, domain) => `${first.toLowerCase()}.${last.toLowerCase()}@${domain}`;

const generateCompanyName = () => {
  const prefix = randomItem(companyPrefixes);
  const suffix = randomItem(companySuffixes);
  const ending = companyEndings[Math.floor(Math.random() * 5)] ? ` ${randomItem(companyEndings.filter(e => e))}` : '';
  return `${prefix}${suffix}${ending}`;
};

const generatePhone = () => {
  const area = randomInt(200, 999);
  const prefix = randomInt(200, 999);
  const line = randomInt(1000, 9999);
  return `(${area}) ${prefix}-${line}`;
};

// Main seeding function
async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Clear existing data
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Account.deleteMany({}),
      Contact.deleteMany({}),
      Lead.deleteMany({}),
      Opportunity.deleteMany({}),
      Activity.deleteMany({}),
      Task.deleteMany({}),
    ]);

    // Create demo user
    console.log('Creating demo user...');
    const user = await User.create({
      name: 'Demo User',
      email: 'demo@example.com',
      password: 'password123', // Will be hashed by the model's pre-save hook
      role: 'admin',
    });
    console.log(`Created user: ${user.email} (password: password123)`);

    // Create accounts
    console.log('Creating accounts...');
    const accounts = [];
    const usedCompanyNames = new Set();

    for (let i = 0; i < ACCOUNT_COUNT; i++) {
      let companyName;
      do {
        companyName = generateCompanyName();
      } while (usedCompanyNames.has(companyName));
      usedCompanyNames.add(companyName);

      const account = await Account.create({
        name: companyName,
        industry: randomItem(industries),
        website: `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        phone: generatePhone(),
        address: {
          street: `${randomInt(100, 9999)} ${randomItem(['Main', 'Oak', 'Pine', 'Maple', 'Cedar', 'Elm'])} ${randomItem(['Street', 'Ave', 'Boulevard', 'Lane', 'Drive'])}`,
          city: randomItem(['San Francisco', 'New York', 'Chicago', 'Los Angeles', 'Seattle', 'Austin', 'Boston', 'Denver', 'Miami', 'Phoenix']),
          state: randomItem(['CA', 'NY', 'IL', 'WA', 'TX', 'MA', 'CO', 'FL', 'AZ', 'NC']),
          zip: `${randomInt(10000, 99999)}`,
          country: 'United States',
        },
        owner: user._id,
      });
      accounts.push(account);
    }
    console.log(`Created ${accounts.length} accounts`);

    // Create contacts
    console.log('Creating contacts...');
    const contacts = [];
    for (let i = 0; i < CONTACT_COUNT; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const account = randomItem(accounts);

      const contact = await Contact.create({
        firstName,
        lastName,
        email: randomEmail(firstName, lastName, account.website.replace('https://www.', '').replace('.com', '') + '.com'),
        phone: generatePhone(),
        title: randomItem(['CEO', 'CTO', 'VP Sales', 'VP Marketing', 'Director', 'Manager', 'Developer', 'Analyst', 'Consultant', 'Coordinator']),
        account: account._id,
        owner: user._id,
      });
      contacts.push(contact);
    }
    console.log(`Created ${contacts.length} contacts`);

    // Create leads
    console.log('Creating leads...');
    const leads = [];
    for (let i = 0; i < LEAD_COUNT; i++) {
      const firstName = randomItem(firstNames);
      const lastName = randomItem(lastNames);
      const company = generateCompanyName();

      const lead = await Lead.create({
        firstName,
        lastName,
        email: randomEmail(firstName, lastName, 'gmail.com'),
        phone: generatePhone(),
        company,
        title: randomItem(['Director', 'Manager', 'VP', 'Executive', 'Owner', 'Founder']),
        status: randomItem(leadStatuses),
        source: randomItem(leadSources),
        owner: user._id,
      });
      leads.push(lead);
    }
    console.log(`Created ${leads.length} leads`);

    // Create opportunities
    console.log('Creating opportunities...');
    const opportunities = [];
    for (let i = 0; i < OPPORTUNITY_COUNT; i++) {
      const stage = randomItem(opportunityStages);
      const account = randomItem(accounts);
      const closeDate = randomDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));

      const opportunity = await Opportunity.create({
        name: `${account.name} - ${randomItem(['New Business', 'Expansion', 'Renewal', 'Upsell'])}`,
        account: account._id,
        amount: randomItem([5000, 10000, 25000, 50000, 75000, 100000, 150000, 250000]),
        stage,
        probability: stageProbabilities[stage],
        closeDate,
        owner: user._id,
      });
      opportunities.push(opportunity);
    }
    console.log(`Created ${opportunities.length} opportunities`);

    // Create activities
    console.log('Creating activities...');
    for (let i = 0; i < ACTIVITY_COUNT; i++) {
      const type = randomItem(activityTypes);
      const contact = Math.random() > 0.3 ? randomItem(contacts) : null;
      const account = Math.random() > 0.5 ? randomItem(accounts) : null;

      await Activity.create({
        type,
        subject: randomItem(subjects[type]),
        description: `${type} regarding ${account?.name || 'prospect'} - discussed requirements and next steps.`,
        date: randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        duration: type === 'Meeting' ? randomInt(30, 120) : type === 'Call' ? randomInt(10, 60) : null,
        contact: contact?._id,
        account: account?._id,
        owner: user._id,
      });
    }
    console.log(`Created ${ACTIVITY_COUNT} activities`);

    // Create tasks
    console.log('Creating tasks...');
    for (let i = 0; i < TASK_COUNT; i++) {
      const contact = Math.random() > 0.5 ? randomItem(contacts) : null;
      const account = Math.random() > 0.5 ? randomItem(accounts) : null;

      await Task.create({
        subject: randomItem(taskSubjects),
        description: 'Follow up on recent discussion and move deal forward.',
        dueDate: randomDate(new Date(), new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
        status: randomItem(taskStatuses),
        priority: randomItem(taskPriorities),
        contact: contact?._id,
        account: account?._id,
        owner: user._id,
      });
    }
    console.log(`Created ${TASK_COUNT} tasks`);

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: 1 (demo@example.com / password123)`);
    console.log(`   Accounts: ${ACCOUNT_COUNT}`);
    console.log(`   Contacts: ${CONTACT_COUNT}`);
    console.log(`   Leads: ${LEAD_COUNT}`);
    console.log(`   Opportunities: ${OPPORTUNITY_COUNT}`);
    console.log(`   Activities: ${ACTIVITY_COUNT}`);
    console.log(`   Tasks: ${TASK_COUNT}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();