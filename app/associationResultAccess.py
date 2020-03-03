
import os
import tables as tb
import numpy as np
import pandas as pd
import glob
import math
from subprocess import PIPE, run, Popen, STDOUT
from databaseEngine import databaseEngine
from ngchmReorder import *
import pickle


WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("WORK_FOLDER")+"/testProject/"
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)


class associationResultAccess:
    __instance = None
    @staticmethod
    def getVTResultAccess(projectID):
        if associationResultAccess.__instance == None:
            print("make new project")
            associationResultAccess(projectID)
        return associationResultAccess.__instance

    def __init__(self,projectID):
        if associationResultAccess.__instance != None:
            raise Exception("This is a singleton.")
        else:
            associationResultAccess.__instance = self
            self.projectID=projectID
            self.dbSNP_map={}
            self.projectFolder = PROJECT_FOLDER+projectID


    def prepare_dbSNP_annotation(self):
        annotationFile = self.projectFolder+"/dbSNP_annotation.tsv"
        command = "vtools output variant variant_id chr pos ref alt dbSNP.name --header"
        if not os.path.isfile(annotationFile) :
            commandCols = []
            for col in command.split():
                commandCols.append(col)
            result = run(commandCols, stdout=PIPE,
                        stderr=PIPE, universal_newlines=True)
            outputFile = open(annotationFile, "w")
            outputFile.write(result.stdout)
        if not self.dbSNP_map:
            with open(annotationFile, "r") as lines:
                for line in lines:
                    cols = line.strip().split("\t")
                    if cols[5] != ".":
                        self.dbSNP_map[cols[0].strip()] = cols[5]
                    else:
                        self.dbSNP_map[cols[0].strip()] = "chr"+cols[1].strip()+"_"+cols[2]
        return self.dbSNP_map


    def get_dbSNP_annotation(self,rownames):
        return [self.dbSNP_map[str(rowname)] for rowname in rownames]

    def get_genotype(self, chr, name):
        HDFfileNames = glob.glob(self.projectFolder+"/tmp*_genotypes_multi_genes.h5")
        HDFfileNames = sorted(HDFfileNames, key=lambda name: int(
            name.split("/")[-1].split("_")[1]))
        allGenotype = []
        allColnames = []
        rownames = []
        if len(chr) == 0:
            filePath = HDFfileNames[0]
            print(filePath)
            file = tb.open_file(filePath)
            for chrIndex in range(1, 23):
                try:
                    node = file.get_node("/chr"+str(chrIndex)+"/"+name+"/")
                    chr = str(chrIndex)
                except tb.exceptions.NoSuchNodeError:
                    pass
            print("find chr ", chr)
        if chr is None:
            return "No such gene", 500
        try:
            for filePath in HDFfileNames:
                print(filePath)
                file = tb.open_file(filePath)
                node = file.get_node("/chr"+chr+"/"+name+"/")
                genotype = node.GT[:]
                rownames = node.rownames[:]
                whereNaN = np.isnan(genotype)
                genotype[whereNaN] = -1
                genotype = genotype.astype(int)
                if (len(allGenotype) == 0):
                    allGenotype = genotype
                else:
                    allGenotype = np.append(allGenotype, genotype, 1)

                colnode = file.get_node("/chr"+chr+"/colnames/")
                colnames = colnode[:]
                allColnames.extend(colnames)
                file.close()
            # allColnames = get_column_names(allColnames)
            allGenotype = pd.DataFrame(
                allGenotype, columns=allColnames, index=rownames)
            return allGenotype, rownames, chr
        except tb.exceptions.NoSuchNodeError:
            print("No such node")
            return "No such node", 500

    def get_variants_summary(self, chr, name, covariate):
        self.prepare_dbSNP_annotation()
        allGenotype, variantIDs, chr = self.get_genotype(chr, name)
        db = databaseEngine(self.projectID)
        db.connect(self.projectID+".proj")
        covariateMap = db.get_CovariateMap(covariate)
        variant_details = db.get_variant_details(variantIDs)
        variant_details["dbSNP"] = self.get_dbSNP_annotation(variantIDs)
        for key, value in covariateMap.items():
            if (len(value) != 0):
                values = [int(x) for x in value]
                allFilter = allGenotype[values]
                print(allGenotype.shape, len(values), allFilter.shape)
                counts = allFilter.apply(lambda x: x.value_counts(), axis=1)
                header = str(key)
                hetero = []
                homo = []
                for count in counts.values:
                    count = list(count)
                    if len(count) != 0:
                        hetero.append(count[2])
                        homo.append(count[3])
                variant_details[header +
                                "_hetero"] = [0 if math.isnan(x) else int(x) for x in hetero]
                variant_details[header +
                                "_homo"] = [0 if math.isnan(x) else int(x) for x in homo]
                variant_details["Sum"] = variant_details[header +
                                                        "_hetero"]+variant_details[header+"_homo"]
        return variant_details.sort_values(by=["Sum"], ascending=False).drop(["Sum"], axis=1)


    def get_gene_pvalue(self, name, associationDB):
        db = databaseEngine(self.projectID)
        db.connect(associationDB+".DB")
        return db.extract_one_pvalue(name, associationDB)


    def get_AssociationResult(self,associationDB):
        gdict = self.load_refgene()
        db = databaseEngine(self.projectID)
        db.connect(associationDB+".DB")
        content = db.extract_pvalue(associationDB)
        id = 1
        output = "id\tchr\tpos\tpvalue\tname\n"

        for line in content:
            name = line[0].strip()
            try:
                pvalue = line[1]
                if name in gdict:
                    output += str(id)+"\t"+gdict[name][0]+"\t" + \
                        str(gdict[name][1])+"\t"+str(pvalue)+"\t"+name+"\n"
                    id = id + 1
                else:
                    pass
                    # print(name, " not in dict")
            except IndexError:
                print(name)
        return output
    


    def load_refgene(self):
        pfname = "/Users/jma7/.variant_tools/resource/refgene.pkl"
        with open(pfname, 'rb') as f:
            gdict = pickle.load(f)
        return gdict

    
    def drawHeatmap(self, chr, name, reorder, covariate, heatmapName):
        allGenotype, variantIDs, _ = self.get_genotype(chr, name)
        dbSNP_map = self.prepare_dbSNP_annotation()
        db = databaseEngine(self.projectID)
        db.connect(self.projectID+".proj")
        covariateMap = db.get_CovariateMap(covariate)
        if os.path.exists(self.projectFolder+"/fake.ngchm"):
            os.remove(self.projectFolder+"/fake.ngchm")
        if os.path.exists(self.projectFolder+"/fake_genotype.tsv"):
            os.remove(self.projectFolder+"/fake_genotype.tsv")

        if reorder == "reorderBoth":
            return self.runCommand(reorder_genotype(self.projectID, allGenotype, heatmapName, covariateMap, covariate))
        elif reorder == "Original":
            return self.runCommand(original_order(self.projectID, allGenotype, heatmapName, covariateMap, covariate))
        elif reorder == "reorderCol1":
            return self.runCommand(reorder_col1(self.projectID, allGenotype, heatmapName, covariateMap, covariate))
        elif reorder == "reorderCol2":
            return self.runCommand(reorder_col2(self.projectID, allGenotype, heatmapName, covariateMap, covariate))


    def runCommand(self, command):
        commandCols = []
        for col in command.split():
            commandCols.append(col)
        print(commandCols)
        result = run(commandCols, stdout=PIPE,
                    stderr=PIPE, universal_newlines=True)
        print("stderr "+result.stderr)
        print("stdout "+result.stdout)
        if "ERROR" in result.stderr:
            return "Internal error", 500
        else:
            if result.stdout == "":
                return result.stderr, 200
            else:
                return result.stdout, 200
