import os
import uuid
from subprocess import PIPE, run, Popen, STDOUT
import sys
from multiprocessing import Process
from shutil import copy2


WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("WORK_FOLDER")+"/testProject/"
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)


class vtoolsCommandAccess:
    __instance = None
    @staticmethod
    def getVTCommandAccess():
        if vtoolsCommandAccess.__instance == None:
            projectID = "VT"+uuid.uuid4().hex
            vtoolsCommandAccess(projectID)
        return vtoolsCommandAccess.__instance
    
    @staticmethod
    def getExistingVTCommandAccess(projectID):
        if vtoolsCommandAccess.__instance == None:
            vtoolsCommandAccess(projectID)
        return vtoolsCommandAccess.__instance

    def __init__(self,projectID):
        if vtoolsCommandAccess.__instance != None:
            raise Exception("This is a singleton.")
        else:
            vtoolsCommandAccess.__instance = self
            self.projectID=projectID
            self.projectFolder = PROJECT_FOLDER+projectID
            if not os.path.exists(self.projectFolder):
                os.makedirs(self.projectFolder)
            os.chdir(self.projectFolder)


    def load_sampleData(self,fileType):
        print(PROJECT_FOLDER+"/10k_test_2k.vcf")
        if fileType == "data" and os.path.exists(PROJECT_FOLDER+"/10k_test_2k.vcf"):
            src = os.path.realpath(PROJECT_FOLDER+"/10k_test_2k.vcf")
            print("copy ", src)
            copy2(src, self.projectFolder+"/")
            return "copy file", 200
        elif fileType == "pheno" and os.path.exists("../simulated.tsv"):
            src = os.path.realpath(PROJECT_FOLDER+"/simulated.tsv")
            copy2(src, self.projectFolder+"/")
            command = "vtools phenotype --from_file " + \
                self.projectFolder+"/simulated.tsv"
            return self.runCommand(command)


    def vtools_create(self):
        command = "vtools init "+self.projectID+" -f"
        result = run(command.split(" "), stdout=PIPE,
                     stderr=PIPE, universal_newlines=True)
        if "ERROR" in result.stderr:
            return "Internal error", 500
        else:
            return self.projectID, 200


    def vtools_import(self,fileName,genomeVersion):
        
        def run_vtools_import(fileName, genomeVersion):
            command = "vtools import "+self.projectFolder + "/"+fileName+" --build " + genomeVersion+" -f"
            with open(self.projectFolder+"/import_log.txt", "a+") as output:
                Popen(command.split(" "), stdout=output,
                    stderr=output, universal_newlines=True)
        
        import_process = Process(target=run_vtools_import, args=(fileName, genomeVersion))
        import_process.start()


    
    def vtools_phenotype(self, phenotype_fileName):
        command = "vtools phenotype --from_file " + phenotype_fileName
        return self.runCommand(command)



    def vtools_output(self, outputTable, outputTableFields, outputAnnoFields):
        command = "vtools output "+outputTable+" "
        if len(outputTableFields) > 0:
            command += outputTableFields
        if len(outputAnnoFields) > 0:
            command += " "+outputAnnoFields
        command += " --limit 20 --header"
        return self.runCommand(command)



    def vtools_use(self, option):
        command = "vtools use "+option
        return self.runCommand(command)



    def vtools_select(self,condition, newTable):
        command = "vtools select "+condition+" -t "+newTable
        return self.runCommand(command)

    
    def vtools_update(self, request, method, table):
        command = "vtools update "+table
        if method == "fromFile":
            fromFile = request.form["fileName"]
            selectedGeno = request.form["selectedGeno"]
            selectedVar = request.form["selectedVar"]
            if fromFile != "":
                command += " --from_file "+fromFile
            if len(selectedGeno) > 0:
                command += " --geno_info "+selectedGeno
            if len(selectedVar) > 0:
                command += " --var_info "+selectedVar
        elif method == "fromStat":
            stat = request.form["stat"]
            if stat != "":
                command += " --from_stat "+stat
        return self.runCommand(command)


    def vtools_association(self, table, phenotype, method, groupby):

        def run_vtools_associate(table, phenotype, method, groupby):
            dbName = "association_"+table+"_"+phenotype+"_"+method+".db"
            command = "vtools associate "+table+" "+phenotype+" --method " + \
                method+" --group_by "+groupby+" --to_db "+dbName+" -f -j 8 -v 1"
            logfile = self.projectFolder + "/associate_log.txt"
            resultfile = self.projectFolder + "/associate_result.txt"
            if os.path.exists(logfile):
                os.remove(logfile)
            if os.path.exists(resultfile):
                os.remove(resultfile)
            print(command)
            result = Popen(command.split(" "), stdout=PIPE,
                        stderr=PIPE, universal_newlines=True)
            tee = Popen(['tee', logfile], stdin=result.stderr)
            tee.communicate()
            tee2 = Popen(['tee', resultfile], stdin=result.stdout)
            tee2.communicate()

        associate_process = Process(target=run_vtools_associate, args=(
            table, phenotype, method, groupby))
        associate_process.start()



    def vtools_show(self,option):
        command = "vtools show "+option
        if option == "show":
            command = "vtools show"
        elif option == "anotations -v0":
            command = "vtools show annotations -v0 "
        elif option == "genotypes":
            command = "vtools show genotypes -l 10"
        elif option == "tables":
            command = "vtools show tables"
        elif option == "fields":
            command = "vtools show fields -l 10"
        return self.runCommand(command)
        # return run(command.split(" "), stdout=PIPE, stderr=PIPE, universal_newlines=True)


    def runCommand(self, command):
        commandCols = []
        for col in command.split():
            commandCols.append(col)
        print(commandCols)
        result = run(commandCols, stdout=PIPE,
                    stderr=PIPE, universal_newlines=True)
        # print("stderr "+result.stderr)
        # print("stdout "+result.stdout)
        if "ERROR" in result.stderr:
            return "Internal error", 500
        else:
            if result.stdout == "":
                return result.stderr, 200
            else:
                return result.stdout, 200




    