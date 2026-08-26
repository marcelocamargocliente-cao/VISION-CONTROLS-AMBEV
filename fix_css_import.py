import re
with open("src/index.css", "r") as f:
    css = f.read()
css = re.sub(r'@import "tailwindcss";', '', css)
css = re.sub(r'@import url\([^)]+\);', '', css)

new_header = """@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&family=JetBrains+Mono:wght@400;500&display=swap');
@import "tailwindcss";
"""

with open("src/index.css", "w") as f:
    f.write(new_header + css)
