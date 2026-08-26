with open("src/pages/EquipamentoDetalhe.tsx", "r") as f:
    content = f.read()

# find the last "    </div>" and replace it with "      </div>\n      </div>\n    </div>"
# or better, replace "    </div>\n  );\n};"
new_end = "      </div>\n    </div>\n    </div>\n  );\n};\n"
content = content.replace("    </div>\n  );\n};\n", new_end)
content = content.replace("    </div>\n  );\n};", new_end)

with open("src/pages/EquipamentoDetalhe.tsx", "w") as f:
    f.write(content)
