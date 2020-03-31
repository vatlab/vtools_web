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
from .page import IndexPage, ImportPage, AssociationPage

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
        self.importPage = ImportPage(self.driver)
        self.associationPage = AssociationPage(self.driver)

    def tearDown(self):
        self.driver.quit()


class TestVtools(TestBase):

    def test_createProject(self):
        projectID = self.indexPage.createRandomeProject()
        TestVtools.projectID=projectID
        self.assertIn("VT", projectID)

    def test_getProject(self):
        print(TestVtools.projectID)
        currentID = self.indexPage.getProject(TestVtools.projectID)
        self.assertEqual(currentID, TestVtools.projectID)

    def test_import(self):
        self.indexPage.getProject(TestVtools.projectID)
        self.importPage.get_ExampleData()
        self.importPage.select_from_selection("existingExampleName","10k_test_2k.vcf")
        content=self.importPage.import_data("geno")
        self.assertIn("996",content)
        self.importPage.select_from_selection("existingExampleName","10k_test_2k.vcf")
        self.importPage.select_from_selection("existingExampleName","simulated.tsv")
        content=self.importPage.import_data("pheno")
        self.assertEqual("sex",content[4])
    # def test_Association(self):
    #     self.indexPage.getProject(TestVtools.projectID)
        self.associationPage.click_on_tab("Association")
        if self.associationPage.check_loading():
            self.associationPage.select_from_selection("projectTables","variant")
            self.associationPage.select_from_selection("projectPhenotypes","disease")
            self.associationPage.select_from_selection("associateMethods","BurdenBt")
            content=self.associationPage.run_association()
            # self.assertEqual("pvalue_BBt",content[5])




if __name__ == '__main__':
    unittest.main()
