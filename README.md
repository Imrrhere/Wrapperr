# 🔍 WrapeR2 - AI Search Assistant

**WrapeR2** is a clean, professional AI search assistant that combines the power of **Claude AI** with **DuckDuckGo's real-time data**. Unlike traditional search engines, WrapeR2 requires **multiple verified sources** before generating responses, ensuring quality and reliability.

## ✨ Features

### 🔍 **Enhanced Search Quality**
- **Multiple Source Verification**: Every answer backed by verified sources
- **Quality Indicators**: Source count and quality assessment
- **Conversation Memory**: Context-aware follow-up questions
- **Real-time Data**: Fresh information from DuckDuckGo

### 🚀 **Core Technology**
- **Frontend**: Next.js 14 + React 18 + TypeScript + TailwindCSS
- **AI Engine**: Claude 3.5 Sonnet (Anthropic API)
- **Data Source**: DuckDuckGo Instant Answer API
- **Hosting**: Vercel (Production Ready)

## 🛠️ **Technology Stack**

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach

### Backend
- **Next.js API Routes**: Server-side functionality
- **DuckDuckGo API**: Real-time search data
- **Claude 3.5 Sonnet**: AI-powered responses
- **TypeScript**: End-to-end type safety

### Deployment
- **Vercel**: Serverless deployment platform
- **Environment Variables**: Secure API key management
- **Edge Functions**: Global performance optimization

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ installed
- Anthropic API key (get one at [console.anthropic.com](https://console.anthropic.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Imrrhere/WrappeR2.git
   cd WrappeR2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env-template.txt .env.local
   ```
   
   Edit `.env.local` and add your Anthropic API key:
   ```env
   ANTHROPIC_API_KEY=your_claude_api_key_here
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🌐 **Deployment**

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "WrapeR2 setup complete"
   git push origin master
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository: `https://github.com/Imrrhere/WrappeR2`
   - Add environment variable: `ANTHROPIC_API_KEY=your_api_key_here`
   - Deploy!

3. **Environment Variable Setup**
   In Vercel dashboard → Settings → Environment Variables:
   ```
   ANTHROPIC_API_KEY = your_anthropic_api_key_here
   ```

## 📁 **Project Structure**

```
WrapeR2/
├── 📂 components/          # React components
│   ├── SearchInput.tsx     # Clean search input
│   ├── ChatMessage.tsx     # Message display
│   └── LoadingIndicator.tsx # Loading animations
├── 📂 lib/                 # Core libraries
│   ├── duckduckgo.ts      # DuckDuckGo integration
│   └── claude.ts          # Claude AI integration
├── 📂 pages/              # Next.js pages
│   ├── api/ask.ts         # Main search API endpoint
│   ├── index.tsx          # Clean main page
│   └── _app.tsx           # App configuration
├── 📂 styles/             # Styling
│   └── globals.css        # Global styles with TailwindCSS
├── 📄 package.json        # Dependencies and scripts
├── 📄 next.config.js      # Next.js configuration
├── 📄 tailwind.config.js  # TailwindCSS configuration
├── 📄 vercel.json         # Vercel deployment config
└── 📄 README.md           # This file
```

## 🔍 **How It Works**

### 1. **Search Process**
```
User Query → DuckDuckGo API → Source Collection → Claude AI → Comprehensive Response
```

### 2. **Source Collection Strategy**
- **Primary Sources**: Abstract + Definition
- **Secondary Sources**: Related Topics
- **Additional Sources**: Search Results
- **Quality Filter**: Multiple verified sources

### 3. **AI Response Generation**
- **Context Building**: Combine all sources into comprehensive prompt
- **Claude Processing**: Generate human-like response
- **Source Attribution**: Link back to original sources

## 🔧 **Configuration**

### Environment Variables
```env
# Required
ANTHROPIC_API_KEY=your_claude_api_key_here
```

### Vercel Configuration
The included `vercel.json` optimizes deployment:
- **30-second timeout** for API routes
- **IAD1 region** for optimal performance
- **Automatic Next.js detection**

## 🚨 **Important Notes**

### **API Requirements**
- **Anthropic API Key**: Required for Claude AI integration
- **DuckDuckGo**: Free tier, no API key needed
- **Response Time**: 5-15 seconds depending on query complexity

### **Security**
- API keys stored in environment variables
- No sensitive data in client-side code
- CORS protection on API routes

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Add feature"`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

## 📝 **License**

This project is open source and available under the [MIT License](LICENSE).

---

**WrapeR2** - Clean, reliable AI search with verified sources. 