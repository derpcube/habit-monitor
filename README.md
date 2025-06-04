# Habit Monitor

A minimalistic, sleek habit tracking application built with Next.js 14, featuring secure authentication, comprehensive statistics, and beautiful visualizations.

## ✨ Features

- **🔐 Secure Authentication**: Email/password authentication with NextAuth.js
- **📊 Beautiful Analytics**: Interactive charts and comprehensive statistics
- **🎯 Habit Tracking**: Daily, weekly, and monthly habit monitoring
- **🔥 Streak Tracking**: Visual streak counters and progress indicators
- **📱 Responsive Design**: Works perfectly on all devices
- **⚡ Real-time Updates**: Instant feedback and smooth animations
- **🎨 Minimalist UI**: Clean, modern interface focused on usability

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd habit-monitor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your values:
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   DATABASE_URL="file:./dev.db"
   ```

4. **Initialize the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS with custom components
- **Authentication**: NextAuth.js with credentials provider
- **Database**: Prisma ORM with SQLite (easily switchable to PostgreSQL/MySQL)
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Animations**: Framer Motion & CSS transitions

## 📱 Usage

### Getting Started
1. **Register**: Create your account with email and password
2. **Login**: Sign in to access your dashboard
3. **Create Habits**: Add new habits with custom colors and frequencies
4. **Track Progress**: Check off completed habits daily
5. **View Analytics**: Monitor your progress with detailed statistics

### Features Overview

#### Dashboard
- Quick overview of today's progress
- Longest streak counter
- Total active habits
- Recent activity summary

#### Habit Management
- ✅ Mark habits as complete/incomplete
- 🎨 Color-coded habit organization
- 📅 Flexible frequency settings (daily/weekly/monthly)
- 📈 Individual habit streaks and statistics

#### Analytics & Statistics
- 📊 7-day progress charts
- 🏆 Top performing habits
- 🔥 Current streak tracking
- 📈 Weekly completion rates
- 📅 Historical data visualization

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **Session Management**: JWT-based sessions with NextAuth.js
- **API Protection**: Server-side authentication checks
- **Input Validation**: Zod schema validation
- **CSRF Protection**: Built-in with NextAuth.js

## 🎨 Design Philosophy

This application follows a minimalist design approach with:
- Clean, uncluttered interface
- Intuitive navigation
- Consistent color scheme
- Smooth animations and transitions
- Focus on essential features
- Mobile-first responsive design

## 📊 Database Schema

The app uses a simple but effective schema:
- **Users**: Account management and authentication
- **Habits**: Habit definitions with metadata
- **HabitEntries**: Daily completion tracking
- **Sessions/Accounts**: NextAuth.js authentication tables

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms
The app can be deployed to any Node.js hosting platform:
- Railway
- Heroku
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

If you have any questions or need help:
- Check the existing issues
- Create a new issue with details
- Reach out via email

---

**Built with ❤️ for better habit formation** 