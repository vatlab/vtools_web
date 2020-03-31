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
from .page import IndexPage

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
        self.driver.get(domain)
        self.indexPage = IndexPage(self.driver)

    def tearDown(self):
        self.driver.quit()

    # def test_server_is_up_and_running(self):
    #     response = urllib.request.urlopen(self.get_server_url())
    #     self.assertEqual(response.code, 200)


class TestVtools(TestBase):

    def test_createProject(self):
        projectID = self.indexPage.createRandomeProject()
        TestVtools.projectID=projectID
        self.assertIn("VT", projectID)

    def test_getProject(self):
        print(TestVtools.projectID)
        currentID = self.indexPage.getProject(TestVtools.projectID)
        self.assertEqual(currentID, TestVtools.projectID)



        


if __name__ == '__main__':
    unittest.main()
