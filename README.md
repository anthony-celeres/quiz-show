# 🎯 QuizMaster - Modern Quiz Management System

A beautiful, full-featured quiz application built with Next.js, TypeScript, and Supabase. Perfect for educational institutions, training programs, or any scenario requiring online assessments.


## ✨ Features

### 🎓 **Student Features**
- **One-time Quiz Attempts**: Students can only attempt each quiz once
- **Real-time Timer**: Visual countdown with color changes as time runs out
- **Progress Tracking**: Visual progress bars and completion indicators
- **Quiz History**: View all past attempts with detailed results
- **Leaderboard**: See rankings and compare performance with peers
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile

### 👨‍💼 **Admin Features**
- **Quiz Creation**: Create comprehensive quizzes with multiple choice questions
- **Quiz Management**: Edit, activate/deactivate, and delete quizzes
- **Student Analytics**: View detailed attempt statistics and performance metrics
- **Real-time Monitoring**: See quiz attempts as they happen
- **User Management**: Track student progress and engagement

### 🎨 **Modern UI/UX**
- **Glass Morphism Design**: Beautiful translucent effects and modern aesthetics
- **Smooth Animations**: Engaging transitions and hover effects
- **Gradient Backgrounds**: Eye-catching color schemes
- **Responsive Layout**: Optimized for all screen sizes
- **Loading States**: Professional loading indicators and progress bars
- **Error Handling**: User-friendly error messages and validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd quiz-project
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase Database

#### Create a Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new account or sign in
3. Click "New Project"
4. Choose your organization and enter project details
5. Wait for the project to be created

#### Get Your Credentials
1. Go to Settings → API
2. Copy your Project URL and anon/public key

#### Create Environment File
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

#### Set Up Database Tables
Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create quizzes table
CREATE TABLE quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  total_points INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create questions table
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_answer INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  percentage INTEGER NOT NULL DEFAULT 0,
  time_taken INTEGER NOT NULL DEFAULT 0,
  answers JSONB,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_roles table for role-based access
CREATE TABLE user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
CREATE POLICY "Users can view their own data" ON user_roles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own attempts" ON quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage quizzes" ON quizzes
  FOR ALL USING (
    auth.uid() = created_by OR 
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage questions" ON questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      JOIN user_roles ur ON ur.user_id = auth.uid()
      WHERE q.id = questions.quiz_id 
      AND (q.created_by = auth.uid() OR ur.role = 'admin')
    )
  );

CREATE POLICY "Anyone can view active quizzes" ON quizzes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view questions for active quizzes" ON questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM quizzes 
      WHERE quizzes.id = questions.quiz_id AND quizzes.is_active = true
    )
  );

CREATE POLICY "Anyone can view leaderboard" ON quiz_attempts
  FOR SELECT USING (true);
```

### 4. Run the Application
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage Guide

### Creating Your First Admin Account
1. Open the application
2. Click "Sign Up"
3. Select "Admin" role
4. Complete registration
5. You can now create and manage quizzes!

### Creating Quizzes (Admin)
1. Sign in as an admin
2. Click "Create Quiz"
3. Fill in quiz details (title, description, duration)
4. Add questions with multiple choice options
5. Set correct answers and point values
6. Save the quiz

### Taking Quizzes (Student)
1. Sign in as a student
2. Browse available quizzes
3. Click "Start Quiz" on any active quiz
4. Answer questions within the time limit
5. Submit when complete
6. View your results and ranking

## 🏗️ Project Structure

```
quiz-project/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles and design system
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   │   ├── QuizForm.tsx  # Quiz creation/editing form
│   │   ├── QuizList.tsx  # Quiz management list
│   │   └── QuizAttemptsList.tsx # View student attempts
│   ├── student/          # Student-specific components
│   │   ├── QuizAttempt.tsx # Quiz taking interface
│   │   └── QuizResults.tsx # Results display
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx    # Enhanced button component
│   │   └── Input.tsx     # Enhanced input component
│   ├── AuthForm.tsx      # Authentication form
│   ├── Leaderboard.tsx   # Global leaderboard
│   └── QuizHistory.tsx   # Student quiz history
├── hooks/                # Custom React hooks
│   └── useAuth.ts        # Authentication hook
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client configuration
│   └── utils.ts          # General utilities
├── types/                # TypeScript type definitions
│   └── quiz.ts           # Quiz-related types
└── README.md             # This file
```

## 🎨 Design System

### Color Palette
- **Primary**: Blue gradients (#3b82f6 to #1d4ed8)
- **Success**: Green gradients (#22c55e to #16a34a)
- **Warning**: Yellow gradients (#f59e0b to #d97706)
- **Error**: Red gradients (#ef4444 to #dc2626)
- **Neutral**: Gray scale (#f9fafb to #111827)

### Typography
- **Font Family**: Inter (system fallbacks)
- **Headings**: Bold weights with gradient text effects
- **Body**: Regular weight with optimal line heights

### Components
- **Modern Cards**: Rounded corners, subtle shadows, hover effects
- **Glass Morphism**: Translucent backgrounds with backdrop blur
- **Animations**: Smooth transitions and micro-interactions
- **Responsive**: Mobile-first design approach

## 🔧 Customization

### Changing Colors
Update the CSS variables in `app/globals.css`:

```css
:root {
  --primary-500: #your-color;
  --primary-600: #your-color;
  /* ... other color variables */
}
```

### Adding New Question Types
1. Extend the Question interface in `types/quiz.ts`
2. Update the QuizForm component
3. Modify the QuizAttempt component
4. Update the scoring logic

### Customizing Animations
Modify the CSS animations in `app/globals.css`:

```css
@keyframes fadeIn {
  /* Your custom animation */
}
```

## 🚀 Deployment

### Deploy to Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables
4. Deploy!

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `.next` folder to Netlify
3. Configure environment variables

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
```

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Authentication**: Secure user authentication via Supabase
- **Role-based Access**: Admin and student role separation
- **Input Validation**: Client and server-side validation
- **HTTPS**: Secure connections in production

## 📊 Database Schema

### Tables Overview
- **quizzes**: Stores quiz metadata and settings
- **questions**: Individual quiz questions and answers
- **quiz_attempts**: Student quiz submissions and scores
- **user_roles**: User role assignments (admin/student)

### Key Relationships
- One quiz has many questions
- One quiz has many attempts
- One user has one role
- One user has many attempts

## 🐛 Troubleshooting

### Common Issues

#### "Invalid supabaseUrl" Error
- Check your `.env.local` file exists
- Verify your Supabase URL and key are correct
- Restart the development server

#### Database Connection Issues
- Ensure your Supabase project is active
- Check your network connection
- Verify your API keys have correct permissions

#### Authentication Problems
- Clear browser cache and cookies
- Check if your Supabase project has authentication enabled
- Verify email confirmation settings

#### Build Errors
- Run `npm run build` to check for TypeScript errors
- Ensure all dependencies are installed
- Check for missing environment variables

### Getting Help
1. Check the console for error messages
2. Review the Supabase logs in your dashboard
3. Ensure all database tables and policies are created correctly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Next.js** for the amazing React framework
- **Supabase** for the backend-as-a-service platform
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide React** for the beautiful icons
- **TypeScript** for type safety

---

**Made with ❤️ for the education community**

For support or questions, please open an issue on GitHub or contact the development team.
