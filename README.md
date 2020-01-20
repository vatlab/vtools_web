Vtools website
1. For variant tools website to work,variant tools needs to be installed on the server. Checkout vtools_web branch from gitlab 
   ( https://bcbgitlab1.mdanderson.edu/jma7/VariantTools/tree/vtools_web ) and install, there is minor adjustment in the output format of progress bar 
   to make the progress bar on frontend works.
   
2. Then creat an env.js file in app/static folder, the content of env.js file is:
   ```
   env={server: server IP address(for example, localhost)}
   ```
3.	```
	cd vtools_website/app/
	```
4. Set the main script for flask, run
	```
	export FLASK_APP=main.py
	```

5. If doing development, run
	```
	export FLASK_ENV=development
	```
6. run
	```
	flask run
	```
