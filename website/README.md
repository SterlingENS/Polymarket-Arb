# Privacy x402 Protocol Website

Modern, interactive website for the Privacy x402 Protocol documentation and playground.

## Features

- **Landing Page** - Hero section with feature highlights
- **Interactive Playground** - Calculate privacy scores in real-time
- **Documentation** - Comprehensive guides and API reference
- **Examples** - Code samples for Ethereum and Solana
- **Responsive Design** - Mobile-friendly layout
- **Dark Theme** - Modern crypto-themed design

## Quick Start

### Option 1: Python HTTP Server (Recommended)

```bash
cd website
python3 -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

### Option 2: Using npm

```bash
npm run website
```

### Option 3: Any Static Server

The website is purely static HTML/CSS/JS, so it works with any static file server:

```bash
# Using Node's http-server
npx http-server website -p 8080

# Using PHP
cd website && php -S localhost:8080
```

## Project Structure

```
website/
├── index.html           # Landing page
├── docs.html            # Documentation
├── examples.html        # Code examples
├── api.html             # API reference
├── playground.html      # Interactive calculator
├── deployment.html      # Deployment guide
├── css/
│   └── style.css       # Main stylesheet
├── js/
│   └── main.js         # Interactive features
└── README.md           # This file
```

## Pages

### Landing Page (index.html)
- Hero section with key statistics
- Feature cards
- Privacy levels comparison
- Chain comparison (Ethereum vs Solana)
- Quick start code examples
- CTA sections

### Playground (playground.html)
- Interactive privacy score calculator
- Real-time configuration
- Visual score display
- Transaction preview
- Protection analysis

### Documentation (docs.html)
- Getting started guide
- Installation instructions
- Configuration options
- Privacy levels explained
- Security considerations

### Examples (examples.html)
- Ethereum examples
- Solana examples
- Stealth address usage
- ZK proof implementation
- Transaction mixing

### API Reference (api.html)
- Complete API documentation
- Method signatures
- Type definitions
- Usage examples

### Deployment (deployment.html)
- Ethereum deployment
- Solana deployment
- Network configuration
- Production checklist

## Customization

### Colors

Edit `css/style.css` to change the color scheme:

```css
:root {
    --primary-color: #6366f1;    /* Purple */
    --secondary-color: #8b5cf6;  /* Violet */
    --accent-color: #ec4899;     /* Pink */
}
```

### Content

All content is in the HTML files. Update text directly in the respective HTML files.

### JavaScript Features

- Tab switching for code examples
- Copy-to-clipboard for code blocks
- Privacy score calculator
- Smooth scrolling
- Mobile menu toggle
- Scroll animations

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Deployment

### GitHub Pages

1. Push to GitHub
2. Enable GitHub Pages in repository settings
3. Select `main` branch and `/website` folder

### Netlify

1. Connect repository
2. Set build command: (none)
3. Set publish directory: `website`

### Vercel

1. Import repository
2. Set framework: Other
3. Set root directory: `website`

## License

MIT - See parent project LICENSE