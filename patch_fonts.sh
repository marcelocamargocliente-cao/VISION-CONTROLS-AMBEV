#!/bin/bash
# Remove inline style fontFamily
find src/pages -name "*.tsx" -type f -exec sed -i -E 's/fontFamily:[^,}]+,?//g' {} +
# Remove font-sans, font-mono, font-[Inter], font-[monospace] from classNames
find src/pages -name "*.tsx" -type f -exec sed -i -E 's/font-sans//g' {} +
find src/pages -name "*.tsx" -type f -exec sed -i -E 's/font-mono//g' {} +
find src/pages -name "*.tsx" -type f -exec sed -i -E 's/font-\[Inter\]//g' {} +
find src/pages -name "*.tsx" -type f -exec sed -i -E 's/font-\[monospace\]//g' {} +
find src/pages -name "*.tsx" -type f -exec sed -i -E "s/fontFamily: 'Inter'//g" {} +
find src/pages -name "*.tsx" -type f -exec sed -i -E "s/fontFamily: 'monospace'//g" {} +

# Re-add font-mono to elements that explicitly need it via class "font-mono"
# Actually the user created a class `.tag-badge, .codigo-sap, .ordem-numero, code, kbd` for mono elements.
