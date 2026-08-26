import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple regex to remove some classes, but we can just let tailwind classes be 
    # if they don't explicitly override the fonts. Wait, the user said:
    # "Substituir por classes globais ou variáveis CSS."
    # Let's replace hex colors in classNames with CSS variables where appropriate.
    
    # 1. Replace text-[#ECEFF1] with text-[var(--text-1)] or just remove it if it's default
    content = re.sub(r'text-\[#[a-fA-F0-9]{6}\]', '', content)
    content = re.sub(r'text-gray-\d{3}', '', content)
    content = re.sub(r'text-white', '', content)
    
    # 2. Replace bg-[#0D1117] with bg-[var(--bg-app)] etc
    # We can just leave bg- classes that are specific, or strip them if they match the old backgrounds
    content = re.sub(r'bg-\[#1C222A\]', 'card', content)
    content = re.sub(r'bg-\[#14181D\]', 'bg-[var(--bg-input)]', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
