Vtools website
1. For variant tools, checkout branch vtools_web from gitlab (https://bcbgitlab1.mdanderson.edu/jma7/VariantTools), assume variant tools has been installed and running.
   Creat an env.js file in app/static folder, the content of env.js file is:
   ```
   env={server: server IP address(for example, localhost)}
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
