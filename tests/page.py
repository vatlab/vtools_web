import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec


class BasePage(object):
	def __init__(self,driver):
		self.driver=driver

class IndexPage(BasePage):
	def createRandomeProject(self):
		self.driver.find_element_by_id("createRandomProject").click()
		return self.get_ProjectID()

	def get_ProjectID(self):
		WebDriverWait(self.driver, 10).until(ec.visibility_of_element_located((By.ID, "title_projectID")))
		ID=self.driver.find_element_by_id("title_projectID").text.split(":")[1]
		print(ID)
		return ID

	def getProject(self,projectID):
		self.driver.find_element_by_id("projectID").sendKeys(projectID)
		self.driver.find_element_by_id("getProjectButton").click()
		return self.get_ProjectID()



