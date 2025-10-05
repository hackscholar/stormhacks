# stormhacks

this repo is for our project at Storm Hacks 2025. Group members include: ahmad, adrian, rafee, annie

# Quick Guide to Git

Most used commands
```bash
    git add . # stage changes
    git commit -m "description"
    git push origin <branch_name>
```

Branch commands (source control)
```bash
    git checkout <branch_name> # this will move you to another branch (caution, it will erase any of your current changes if you made any)
    git checkout -b <new_branch_name> # this creates a new branch and enters it for you (Most used commands)
```

Common Workflow (in case you were doing work in main but you wanna push to timeline)
```bash
    git add .
    git commit -m "description"
    git checkout <branch_name>
    git merge <another branch name>
    git push origin timeline
```