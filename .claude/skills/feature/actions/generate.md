# Generate Action

1. Check $ARGUMENTS (after "generate"):
   - If it has text, look for that text as a Phase or section in the  `context/ROADMAP.md`
   - If is blank, ask the user what part of the ROADMAP wannts to generate.
   - If not specified, don't generate anything

2. Search `context/ROADMAP.md` to match the section to generate
3. Analyze the codebase and the `context/ROADMAP.md` to geerate the SPECS
4. Use `context/SPEC_TEMPLATE.md` as template for the SPECS generated
5. Ask clarifiynng questions if needed
6. Save the files on `context/feature` folder