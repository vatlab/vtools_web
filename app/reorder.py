
import glob
import tables as tb
import numpy as np
import pandas as pd
from scipy.stats import wilcoxon
import scipy.cluster.hierarchy as shc
from scipy.spatial import distance
import os
import sqlite3
import math

WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("WORK_FOLDER")+"/testProject/"

def create_connection(db_file,projectID):
    db_file=PROJECT_FOLDER+projectID+"/"+db_file
    conn = None
    try:
        conn = sqlite3.connect(db_file)
    except sqlite3.Error:
        print("error")
    return conn

def get_variant_details(conn,variantIDs):
    cur = conn.cursor()
    variants = ",".join([str(variantID) for variantID in variantIDs])
    cur.execute("SELECT chr,pos,ref,alt FROM variant where variant_id in "+"("+variants+")")
    rows = cur.fetchall()
    rows = pd.DataFrame(rows, index=variantIDs,columns=["chr","pos","ref","alt"])
    return rows



def get_CovariateMap(projectID):
    covariateMap = {}
    projectFolder = PROJECT_FOLDER+projectID
    with open(projectFolder+"/disease.tsv", "r") as lines:
        for line in lines:
            cols = line.strip().split("\t")
            if cols[1] not in covariateMap:
                covariateMap[cols[1]] = []
            else:
                covariateMap[cols[1]].append(cols[0])
    return covariateMap




def get_genotype_counts(genotypes):
    return genotypes.apply(lambda x:x.value_counts(),axis=1)


def reorder_genotype():
    name = "YEATS2"
    chr = "3"
    print("showNGCHM", chr, name)
    HDFfileNames = glob.glob("/Users/jma7/Development/vtools_website/testProject/test2k/tmp*_genotypes_multi_genes.h5")
    HDFfileNames = sorted(HDFfileNames, key=lambda name: int(name.split("/")[-1].split("_")[1]))
    allGenotype = []
    allColnames = []
    variantIDs=""
    for filePath in HDFfileNames:
        print(filePath)
        file = tb.open_file(filePath)
        node = file.get_node("/chr"+chr+"/"+name+"/")
        genotype = node.GT[:]
        variantIDs = node.rownames[:]
        whereNaN = np.isnan(genotype)
        genotype[whereNaN] = -1
        genotype = genotype.astype(int)
        if (len(allGenotype) == 0):
            allGenotype = genotype
        else:
            allGenotype = np.append(allGenotype, genotype, 1)
        # numCols = len(node.GT[:][0])
        # colnames = []
        # for num in range(1, numCols+1):
        #     colnames.append("col"+str(num))
        colnode = file.get_node("/chr"+chr+"/colnames/")
        colnames = colnode[:]
        allColnames.extend(colnames)
        file.close()

    allGenotype = pd.DataFrame(allGenotype, columns=allColnames)
    covariateMap=get_CovariateMap("test2k")
    conn=create_connection("test.proj","test2k")
    variant_details=get_variant_details(conn,variantIDs)
   
    for key, value in covariateMap.items():
        if (len(value)!=0):
            values = [int(x) for x in value]
            allFilter = allGenotype[values]
            counts=get_genotype_counts(allFilter)  
            header=key
            hetero=[]
            homo=[] 
            for count in counts.values:
                count=list(count)
                if len(count)!=0:
                    hetero.append(count[2])
                    homo.append(count[3])
            variant_details[header+"_hetero"]=[0 if math.isnan(x) else int(x) for x in hetero]
            variant_details[header+"_homo"]=[0 if math.isnan(x) else int(x) for x in homo]
    print(variant_details)

    
        

    # reordered_columns = []
    # for key, value in covariateMap.items():
    #     values = [int(x) for x in value]
    #     allFilter = allGenotype[values].applymap(lambda x: x > 0)
    #     print(allFilter.shape)
    #     allFilter=allFilter.transpose()
    #     dend = shc.dendrogram(shc.linkage(distance.pdist(
    #         allFilter, 'euclidean'), method='ward'), no_plot=True)
    #     reordered_columns.extend(allFilter.index[dend["leaves"]])




if __name__ == "__main__":
    # Only for debugging while developing
    reorder_genotype()
