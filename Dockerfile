FROM nginx:alpine
COPY . /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#Hvad gør denne fil?** Den tager alle dine HTML/CSS/JS filer og lægger dem ind i en Nginx webserver container.

---

