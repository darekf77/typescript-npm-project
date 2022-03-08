
# Environment config

## worksapce
Inside workspace and workspace children configurations are based on files *environment< enrionment name >.js* which eventualy generate **tmp-environment.json**.

This file can contain:
- workspace configuration for routing (domain,ip)
- current inited evironment name
- apps secret/public keys
- other constants or meta information about project and subprojects

# Example **tmp-environment.json**: 
```json
{
  "domain": "mydomain.com",
  "name": "prod",
  "currentProjectName": "server",
  "workspace": {
    "workspace": {},
     "projects": []      
  }
}
```
