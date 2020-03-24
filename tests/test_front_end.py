#  To make selenium work, install following packages first
#  pip install selenium
#  pip install nose2
#  pip install Flask-Testing
#  pip install urllib2
#  run by typing "nose2"


import unittest
import urllib.request
from flask import Flask
import time
from flask_testing import LiveServerTestCase
from selenium import webdriver
import page

class TestBase(LiveServerTestCase):

    def create_app(self):
        app = Flask(__name__)
        config_name = "testing"
        # app = create_app(config_name)
        app.config.update(
            # Change the port that the liveserver listens on
            LIVESERVER_PORT=5000
        )
        return app

    def setUp(self):
        """Setup the test driver and create test users"""
        self.driver = webdriver.Chrome()
        domain=self.get_server_url()
        print(domain)
        # path="/vtools/"
        path=""
        self.driver.get(domain+path)

    def tearDown(self):
        self.driver.quit()

    # def test_server_is_up_and_running(self):
    #     response = urllib.request.urlopen(self.get_server_url())
    #     self.assertEqual(response.code, 200)


class TestVtools(TestBase):

    def test_createProject(self):
        indexPage = page.IndexPage(self.driver)
        self.assertIn("VT", indexPage.createRandomeProject())

        


if __name__ == '__main__':
    unittest.main()
