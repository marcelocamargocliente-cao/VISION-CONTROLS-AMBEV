with open("src/utils/formatters.ts", "r") as f:
    text = f.read()

text = text.replace("return parts.join('\n').trim();", "return parts.join('\\n').trim();")

with open("src/utils/formatters.ts", "w") as f:
    f.write(text)
