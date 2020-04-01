Vtools website

1.	```
	git clone https://github.com/vatlab/vtools_web.git
	cd vtools_website/app/
	```
2. Set the main script for flask
	```
	export FLASK_APP=main.py
	```

3. If doing development
	```
	export FLASK_ENV=development
	```
4.  Set the path for project storage
	```
	export PROJECT_FOLDER=PATH_TO_PROJECT_STORAGE
	```
5.  Set the path for vtools_web folder (the folder created by git clone)
	```
	export WORK_FOLDER=PATH_TO_VTOOLS_WEB
	```
5. run
	```
	flask run
	```

Docker version:
On Digital Ocean
1. In /home/vtools_user/vtools_web folder, set .env for enviromental parameters, current setting is
	```
	REFERENCE_FOLDER=/home/vtools_user/.variant_tools
	PROJECT_FOLDER=/home/vtools_user/testProject
    ```
    .variant_tools folder has all the reference files for variantTools to use. These two folders will be mounted into docker containters.
2.  A docker network has been created on digital ocean.
	```
	docker network create vtoolsnet
	```
2.  Run docker-compose,
	```
	docker-compose  up --build -d
	```


Tests:
1. To make selenium work, install following packages first
	```
	pip install selenium
	pip install nose2
	pip install Flask-Testing
	pip install urllib2
	```
2. Download chrome driver (https://chromedriver.chromium.org/getting-started).
3. Start Flask in app folder, then run tests:
    ```
	cd tests
	nose2
   ```

