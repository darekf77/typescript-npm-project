# DEPS (Dependencies managmement)
## Update deps from another project
```
firedev deps:from /path/to/dependenices/relative/or/absolute`
```


## Show all dependencies in project package.json
They may be hidden becouse of package.json inheritance.

```
firedev deps:show
```

## hide all dependencies in project package.json
Sometimes for some reason you just want to see structure of package.json without packages.

```
firedev deps:hide
```

## Dedupe package
Remove nested packages from node_modules folder

```
firedev deps:dedupe first-pacakage-name-to-dedupe next-package-name-to-dedupe
```
