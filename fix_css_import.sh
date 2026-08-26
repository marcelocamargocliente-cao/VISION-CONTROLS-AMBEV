#!/bin/bash
sed -i -e '/@import "tailwindcss";/d' src/index.css
sed -i '1i @import "tailwindcss";' src/index.css
sed -i '1i @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap");' src/index.css
# also remove the duplicate import further down
sed -i '/fonts.googleapis.com/d' src/index.css
# re-add the one at the top since it might have been deleted by the third sed command if I'm not careful. Let's just do it cleanly:
