Import, render and complete the New York Times crossword or The Guardian cryptic crossword in Roam Research.

<img width="461" alt="image" src="https://github.com/mlava/crosswords/assets/6857790/e0d6a48a-7b23-47d1-bdd6-1ef789f1387d">

**NEW:**
- added cryptic crosswords from The Guardian - latest or random
- much faster... :rocket:
- fixed stack overflow errors due to my poor programming skills :-)
- fixed rendering errors for crosswords with double letters

**Previously:**
- fixed rendering for crosswords with unequal row and column counts
- Import today's crossword

You can import a crossword using:
- command palette command 'Random crossword from New York Times' or 'Today\'s crossword from New York Times'
- using a SmartBlock as shown:
  - #SmartBlock crossword
    - <%NYTCROSSWORD%> or <%NYTCROSSWORDTODAY%>
  - {{NYTCrossword:SmartBlock:crossword}}

- command palette command 'Random cryptic crossword from The Guardian' or 'Today\'s cryptic crossword from The Guardian'
- using a SmartBlock as shown:
  - #SmartBlock crossword
    - <%GUARDIANCROSSWORD%> or <%GUARDIANCROSSWORDTODAY%>
  - {{GuardianCrossword:SmartBlock:crossword}}

Your guessed letters are saved in your graph, so you can come back on another device or at another time and complete the puzzle. Good luck!