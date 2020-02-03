
import glob
import tables as tb
import numpy as np
import pandas as pd
from scipy.stats import wilcoxon
import scipy.cluster.hierarchy as shc
from scipy.spatial import distance


def reorder_genotype():
    name = "YEATS2"
    chr = "3"
    print("showNGCHM", chr, name)
    HDFfileNames = glob.glob("/Users/jma7/Development/vtools_website/testProject/test2k/tmp*_genotypes_multi_genes.h5")
    HDFfileNames = sorted(HDFfileNames, key=lambda name: int(name.split("/")[-1].split("_")[1]))
    allGenotype = []
    allColnames = []
    for filePath in HDFfileNames:
        print(filePath)
        file = tb.open_file(filePath)
        node = file.get_node("/chr"+chr+"/"+name+"/")
        genotype = node.GT[:]
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
    # print(allColnames)
    allGenotype = pd.DataFrame(allGenotype, columns=allColnames)
    covariateMap = {}
    with open("/Users/jma7/Development/vtools_website/testProject/test2k/disease.tsv", "r") as lines:
        for line in lines:
            cols = line.strip().split("\t")
            if cols[1] not in covariateMap:
                covariateMap[cols[1]] = []
            else:
                covariateMap[cols[1]].append(cols[0])
    reordered_columns = []
    # for key, value in covariateMap.items():
    #     values = [int(x) for x in value]
    #     allFilter = allGenotype[values].applymap(lambda x: x > 0)
    #     colSum = allFilter.sum(axis=0).sort_values(ascending=False)
    #     colSum = colSum[colSum > 0]
    #     reordered_columns.extend(colSum.index)
  


    for key, value in covariateMap.items():
        values = [int(x) for x in value]
        allFilter = allGenotype[values].applymap(lambda x: x > 0)
        print(allFilter.shape)
        allFilter=allFilter.transpose()
        dend = shc.dendrogram(shc.linkage(distance.pdist(
            allFilter, 'euclidean'), method='ward'), no_plot=True)
        reordered_columns.extend(allFilter.index[dend["leaves"]])

    print(reordered_columns)

    # keys = list(covariateMap.keys())
    # values1 = [int(x) for x in covariateMap[keys[0]]]
    # genotype1 = allGenotype[values1].transpose()
    # values2 = [int(x) for x in covariateMap[keys[1]]]
    # genotype2 = allGenotype[values2].transpose()
    # pvalues = []
    # for rowIndex in range(allGenotype.shape[0]):
    #     stat, p = wilcoxon(genotype1.iloc[rowIndex], genotype2.iloc[rowIndex])
    #     pvalues.append((rowIndex, p))
    # pvalues.sort(key=lambda x: x[1])
    # reordered_rows = [pvalue[0] for pvalue in pvalues]
    # print(reordered_rows)
    # print(reordered_columns)
    # print(allGenotype.shape)
    # reordered_genotype = allGenotype.loc[reordered_rows, reordered_columns]
    # print(reordered_genotype)


if __name__ == "__main__":
    # Only for debugging while developing
    reorder_genotype()
