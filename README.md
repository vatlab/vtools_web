Vtools website
1. creat an env.js file in static folder, the content of env.js file is:
   ```
   env={server: server IP address}
   ```
2.	```
	cd vtools_website/app/
	```
3. Set the main script for flask, run
	```
	export FLASK_APP=main.py
	```

4. If doing development, run
	```
	export FLASK_ENV=development
	```
5. run
	```
	flask run
	```
