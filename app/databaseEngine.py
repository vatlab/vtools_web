import sqlite3
import os
import pandas as pd

WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("PROJECT_FOLDER")
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)


class databaseEngine:
    def __init__(self,projectID):
        self.datbase = None
        self.projectID=projectID
        self.projectFolder = PROJECT_FOLDER+projectID
        print(self.projectFolder)

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

    def extract_one_pvalue(self, name, associationDB):
        cur = self.conn.cursor()
        if associationDB == "association_variant_disease_BurdenBt" and self.projectID == "test2k":
            associationDB = "HDF"
        cur.execute("SELECT * FROM " +
                    associationDB + " where refgene_name2=?", (name,))
        row = cur.fetchone()
        cur.close()
        return row[5]


    def extract_pvalue(self, associationDB):
        cur = self.conn.cursor()
        if associationDB == "association_variant_disease_BurdenBt" and self.projectID == "test2k":
            associationDB = "HDF"
        print(associationDB)
        cur.execute("SELECT * FROM "+associationDB)
        rows = cur.fetchall()
        cur.close()
        return rows



    # def prepare_column_names(conn):
    #     cur = conn.cursor()
    #     cur.execute("SELECT sample_id,sample_name FROM sample")
    #     rows = cur.fetchall()
    #     samples_map = {}
    #     for row in rows:
    #         samples_map[row[0]] = row[1]


    # def get_column_names(colnames):
    #     return [samples_map[colname] for colname in colnames]
