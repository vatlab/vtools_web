import os
import pickle

# pfname = os.path.join(env.local_resource, 'resource/refgene.pkl')
pvalueFile = "/Users/jma7/Development/VAT_ref/ismb-2018/data/EA_RV.asso.res"
pfname = "/Users/jma7/.variant_tools/resource/refgene.pkl"
with open(pfname, 'rb') as f:
    gdict = pickle.load(f)

with open(pvalueFile, 'r') as f:
    f.readline()
    content = f.readlines()
id = 1
output = open("/Users/jma7/Development/vtools_website/app/static/EA_RV.asso.res.pvalue.tsv", "w")
output.write("id\tchr\tpos\tpvalue\tname\n")
for line in content:
    line = line.strip()
    cols = line.split("\t")
    name = cols[0].strip()
    pvalue = cols[5].strip()
    if name in gdict:
        output.write(str(id)+"\t"+gdict[name][0]+"\t"+str(gdict[name][1])+"\t"+str(pvalue)+"\t"+name+"\n")
        id = id + 1
    else:
    	print(name, " not in dict")
output.close()
