# Upload on production server

Note: use eduVPN if not on eduroam

```bash
sftp LOGIN@etud.insa-toulouse.fr << EOF
put -r Project/* /home/cdura/public_html/3A-Projet-Prog-Web
EOF

# If it doesn't work, try to ssh first
# You can also copy paste the put command
```

# Access production server

https://etud.insa-toulouse.fr/~cdura/3A-Projet-Prog-Web
