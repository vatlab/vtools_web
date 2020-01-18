import tables as tb
import numpy as np
import pandas as pd
filePath = "/Users/jma7/Development/VAT_ref/testChad/100k/tmp_91668_100000_genotypes_multi_genes.h5"
file = tb.open_file(filePath)
node = file.get_node("/chr7/CLDN3/")
genotype = node.GT[:].astype(int)
print(genotype)
numCols = len(node.GT[1, :])
colnames = []
for num in range(1, numCols+1):
	colnames.append("col"+str(num))

pd.DataFrame(genotype, columns=colnames).to_csv("fake_genotype.tsv", sep="\t")

file.close()
