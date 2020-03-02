import sqlite3
import os
import pandas as pd

WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("WORK_FOLDER")+"/testProject/"
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)


class databaseEngine:
    def __init__(self,projectID):
        self.datbase = None
        self.projectID=projectID
        self.projectFolder = PROJECT_FOLDER+projectID

    def connect(self,database):
        self.database = self.projectFolder+"/"+database
        self.conn = None
        try:
            self.conn = sqlite3.connect(self.database)
        except sqlite3.Error:
            print("error")
        

    def get_variant_details(self,variantIDs):
        cur = self.conn.cursor()
        variants = ",".join([str(variantID) for variantID in variantIDs])
        cur.execute(
            "SELECT chr,pos,ref,alt FROM variant where variant_id in "+"("+variants+")")
        rows = cur.fetchall()
        cur.close()
        detail = pd.DataFrame(rows, index=variantIDs, columns=[
                            "chr", "pos", "ref", "alt"])
        return detail

    def get_CovariateMap(self,covariate):
        cur = self.conn.cursor()
        cur.execute("SELECT sample_id, "+covariate+" FROM sample")
        rows = cur.fetchall()
        cur.close()
        covariateMap = {}
        covariateFile = self.projectFolder+"/"+covariate+".tsv"
        if not os.path.isfile(covariateFile):
            outputFile = open(covariateFile, "w")
            for line in rows:
                outputFile.write(str(line[0])+"\t"+str(line[1])+"\n")

        for line in rows:
            if line[1] not in covariateMap:
                covariateMap[line[1]] = []
            else:
                covariateMap[line[1]].append(line[0])
        return covariateMap
