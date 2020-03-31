import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.wait import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec
from .web_table import WebTable


class BasePage(object):
	def __init__(self,driver):
		self.driver=driver

	def select_from_selection(self,id_of_select,option_selected):
		el = self.driver.find_element_by_id(id_of_select)
		WebDriverWait(self.driver, 60).until(ec.presence_of_element_located((By.CSS_SELECTOR, "#"+id_of_select+" option[value='"+option_selected+"']")))
		for option in el.find_elements_by_tag_name('option'):
			if option.text == option_selected:
				option.click()
				break
				
	def get_content_from_info(self):
		return self.driver.find_element_by_id("infoDiv").text

	def get_header_from_dataTable(self):
		w = WebTable(self.driver.find_element_by_xpath("//table[@id='dataTable']"))
		content=w.get_header()
		return content

	def click_on_tab(self,tabName):
		WebDriverWait(self.driver, 20).until(ec.element_to_be_clickable((By.LINK_TEXT, tabName))).click()
		



class IndexPage(BasePage):
	def createRandomeProject(self):
		self.driver.find_element_by_id("createRandomProject").click()
		return self.get_ProjectID()

	def get_ProjectID(self):
		WebDriverWait(self.driver, 60).until(ec.visibility_of_element_located((By.ID, "title_projectID")))
		ID=self.driver.find_element_by_id("title_projectID").text.split(":")[1].strip()
		print(ID)
		return ID

	def getProject(self,projectID):
		self.driver.find_element_by_id("projectID").send_keys(projectID)
		self.driver.find_element_by_id("getProjectButton").click()
		return self.get_ProjectID()


class ImportPage(BasePage):
	def get_ExampleData(self):
		self.driver.find_element_by_id("exampleData").click()

	def import_data(self,type):
		self.driver.find_element_by_id("importButton").click()
		if type=="geno":
			WebDriverWait(self.driver, 60).until(ec.visibility_of_element_located((By.ID, "infoDiv")))
			content=self.get_content_from_info()
		if type=="pheno":
			WebDriverWait(self.driver, 60).until(ec.visibility_of_element_located((By.ID, "dataTable")))
			content=self.get_header_from_dataTable()
		return content

class AssociationPage(BasePage):
	def check_loading(self):
		WebDriverWait(self.driver, 60).until(ec.visibility_of_element_located((By.ID, "runAssociation")))
		return True

	def run_association(self):
		WebDriverWait(self.driver, 60).until(ec.visibility_of_element_located((By.ID, "runAssociation")))
		self.driver.find_element_by_id("runAssociation").click()
		WebDriverWait(self.driver, 60).until(ec.visibility_of_element_located((By.ID, "dataTable")))
		content=self.get_header_from_dataTable()
		return content






