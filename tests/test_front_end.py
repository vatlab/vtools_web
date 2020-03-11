import unittest
import urllib.request
from flask import Flask
import time
from flask_testing import LiveServerTestCase
from selenium import webdriver

class TestBase(LiveServerTestCase):

    def create_app(self):
        app = Flask(__name__)
        config_name = "testing"
        # app = create_app(config_name)
        app.config.update(
            # Change the port that the liveserver listens on
            LIVESERVER_PORT=8087
        )
        return app

    def setUp(self):
        """Setup the test driver and create test users"""
        self.driver = webdriver.Chrome()
        domain=self.get_server_url()
        path="/vtools/"
        self.driver.get(domain+path)

    def tearDown(self):
        self.driver.quit()

    # def test_server_is_up_and_running(self):
    #     response = urllib.request.urlopen(self.get_server_url())
    #     self.assertEqual(response.code, 200)


class TestVtools(TestBase):

    def test_createProject(self):
        self.driver.find_element_by_id("createRandomProject").click()
        time.sleep(50)


if __name__ == '__main__':
    unittest.main()
