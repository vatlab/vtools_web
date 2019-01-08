FROM tiangolo/uwsgi-nginx-flask:python3.7

# If STATIC_INDEX is 1, serve / with /static/index.html directly (or the static URL configured)
ENV STATIC_INDEX 1
ENV WORK_FOLDER "/app" 

ENV NGINX_MAX_UPLOAD 4g

# ENV STATIC_INDEX 0

COPY ./app /app
