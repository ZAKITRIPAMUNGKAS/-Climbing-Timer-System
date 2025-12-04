# Design Guide - FPTI Karanganyar Premium UI

## 🎨 Color Palette

- **Rich Black**: `#0a0a0a` - Primary background
- **Gunmetal**: `#1a1a1a` - Secondary background (cards/sections)
- **Crimson**: `#E11D23` - Primary accent (red from logo)
- **Goldenrod**: `#FFC107` - Secondary accent (gold from logo)
- **Off-White**: `#F5F5F5` - Text color

## 📝 Typography

- **Headings**: Montserrat (Bold, Uppercase)
- **Body**: Inter (Light/Regular)
- **Monospace**: Chakra Petch (for timer/numbers)

## ✨ Features Implemented

1. **Dark Mode Premium Design**
   - Rich black backgrounds
   - Glassmorphism effects
   - Smooth animations with Framer Motion

2. **Hero Section**
   - Parallax background image
   - Gradient text effects
   - Floating stats card

3. **Sections**
   - About (Tentang)
   - Athletes (Atlet) - Card grid dengan hover effects
   - Schedule (Jadwal) - Vertical timeline
   - News (Berita) - Masonry grid style
   - Contact (Kontak)

4. **Navbar**
   - Glassmorphism saat scroll
   - Smooth transitions
   - Mobile responsive menu

5. **Animations**
   - Framer Motion untuk smooth transitions
   - Hover effects pada cards
   - Scroll-triggered animations

## 🚀 Usage

```bash
# Development
npm run dev

# Build
npm run build
```

## 📦 Dependencies

- **Tailwind CSS**: Styling
- **Framer Motion**: Animations
- **Lucide React**: Icons

## 🎯 Customization

Semua warna dan styling bisa diubah di:
- `tailwind.config.js` - Color palette & theme
- `src/pages/LandingPage.jsx` - Component structure
- `src/pages/LandingPage.css` - Custom styles

