# Icon Placeholder Files

This directory should contain:
- icon16.png (16x16 pixels)
- icon48.png (48x48 pixels)  
- icon128.png (128x128 pixels)

These are placeholder files. You should replace them with actual PNG icons for your extension.

For now, you can use any 16x16, 48x48, and 128x128 pixel PNG images, or create simple colored squares as placeholders.

Example creation with imagemagick (if installed):
```bash
convert -size 16x16 xc:"#0969da" icon16.png
convert -size 48x48 xc:"#0969da" icon48.png  
convert -size 128x128 xc:"#0969da" icon128.png
```

Or use online PNG generators or design tools to create proper icons.
