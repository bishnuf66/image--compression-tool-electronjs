# WebP Image Converter

A desktop application for converting images to WebP format with size optimization capabilities. Built with Electron and Sharp, this tool provides a simple and efficient way to convert your images while maintaining quality and reducing file size.

![WebP Converter Screenshot](assets/screenshot.png)

## Features

- Convert images to WebP format
- Batch conversion of multiple images
- Adjustable quality settings
- Preview images before conversion
- Simple and intuitive user interface
- Cross-platform support (Windows, macOS, Linux)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js) or Yarn

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/webp-converter.git
   cd webp-converter
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

## Building for Production

To create a production build of the application:

```bash
# For development (unpacked)
npm run pack

# For production (installer)
npm run dist
```

The builds will be available in the `dist` directory.

## Usage

1. Launch the application
2. Click "Select Images" to choose one or more images to convert
3. Adjust the quality slider if needed
4. Click "Convert" to start the conversion
5. Find your converted files in the same directory as the originals with a .webp extension

## Development

### Project Structure

- `main.js` - Main Electron process
- `renderer.js` - Renderer process
- `preload.js` - Preload script for secure context bridging
- `index.html` - Main application window
- `style.css` - Application styles

### Available Scripts

- `npm start` - Start the application in development mode
- `npm run pack` - Package the application
- `npm run dist` - Create distribution packages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Bishnu Bishowkarma

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Image processing powered by [Sharp](https://sharp.pixelplumbing.com/)
- Icons from [Font Awesome](https://fontawesome.com/)

---

⭐ If you find this project useful, consider giving it a star on GitHub!
