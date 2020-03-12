import os
import scipy.cluster.hierarchy as shc
from scipy.spatial import distance
from scipy.stats import mannwhitneyu

WORK_FOLDER = os.getenv("WORK_FOLDER")+"/app/"
PROJECT_FOLDER = os.getenv("PROJECT_FOLDER")
if not os.path.exists(PROJECT_FOLDER):
    os.makedirs(PROJECT_FOLDER)


def original_order(projectID, allGenotype, heatmapName, covariateMap, covariate):
    projectFolder = PROJECT_FOLDER+projectID
    allGenotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")
    command = '{}/mda_heatmap_gen/heatmap.sh "{}/mda_heatmap_gen"  "{}" "chm_name|{}" "chm_description|validateTool" "matrix_files|path|{}|name|datalayer|summary_method|sample" "row_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels" "col_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels" "classification|name|disease|path|{}|category|column_discrete" "output_location|{}"'.format(
        WORK_FOLDER, WORK_FOLDER, PROJECT_FOLDER, heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/"+covariate+".tsv", projectFolder+"/cache/"+heatmapName+".ngchm")
    print(command)
    return command



def reorder_genotype(projectID, allGenotype, heatmapName, covariateMap, covariate):
    projectFolder = PROJECT_FOLDER+projectID
    reordered_rows = reorder_rows(allGenotype, covariateMap)
    reordered_cols = reorder_columns(allGenotype, covariateMap)
    reordered_genotype = allGenotype.iloc[reordered_rows, :]
    reordered_genotype = allGenotype.loc[:, reordered_cols]
    reordered_genotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")

    command = '{}/mda_heatmap_gen/heatmap.sh {}/mda_heatmap_gen {} chm_name|{} chm_description|validateTool matrix_files|path|{}|name|datalayer|summary_method|sample row_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels col_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels classification|name|disease|path|{}|category|column_discrete output_location|{}'.format(
        WORK_FOLDER, WORK_FOLDER, PROJECT_FOLDER, heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/"+covariate+".tsv", projectFolder+"/cache/"+heatmapName+".ngchm")
    
    return command


def reorder_col1(projectID, allGenotype, heatmapName, covariateMap, covariate):
    projectFolder = PROJECT_FOLDER+projectID
    reordered_cols = reorder_columns(allGenotype, covariateMap)
    reordered_genotype = allGenotype.loc[:, reordered_cols]
    reordered_genotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")
    command = '{}/mda_heatmap_gen/heatmap.sh {}/mda_heatmap_gen {} chm_name|{} chm_description|validateTool matrix_files|path|{}|name|datalayer|summary_method|sample row_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels col_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels classification|name|disease|path|{}|category|column_discrete output_location|{}'.format(
        WORK_FOLDER, WORK_FOLDER, PROJECT_FOLDER, heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/"+covariate+".tsv", projectFolder+"/cache/"+heatmapName+".ngchm")
    print(command)
    return command


def reorder_col2(projectID, allGenotype, heatmapName, covariateMap, covariate):
    projectFolder = PROJECT_FOLDER+projectID
    reordered_cols = reorder_columns_hiera(allGenotype, covariateMap)
    reordered_genotype = allGenotype.loc[:, reordered_cols]
    reordered_genotype.to_csv(projectFolder+"/fake_genotype.tsv", sep="\t")
    command = '{}/mda_heatmap_gen/heatmap.sh {}/mda_heatmap_gen {} chm_name|{} chm_description|validateTool matrix_files|path|{}|name|datalayer|summary_method|sample row_configuration|order_method|Hierarchical|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels col_configuration|order_method|Original|distance_metric|manhattan|agglomeration_method|ward.D|tree_covar_cuts|0|data_type|labels classification|name|disease|path|{}|category|column_discrete output_location|{}'.format(
        WORK_FOLDER, WORK_FOLDER, PROJECT_FOLDER, heatmapName, projectFolder+"/fake_genotype.tsv", projectFolder+"/"+covariate+".tsv", projectFolder+"/cache/"+heatmapName+".ngchm")
    print(command)
    return command


def reorder_columns(allGenotype, covariateMap):
    reordered_columns = []
    for key, value in covariateMap.items():
        values = [int(x) for x in value]
        allFilter = allGenotype[values].applymap(lambda x: x > 0)
        colSum = allFilter.sum(axis=0).sort_values(ascending=False)
        colSum = colSum[colSum > 0]
        reordered_columns.extend(colSum.index)
    return reordered_columns


def reorder_columns_hiera(allGenotype, covariateMap):
    reordered_columns = []
    for key, value in covariateMap.items():
        values = [int(x) for x in value]
        # allFilter = allGenotype[values].applymap(lambda x: x > 0)
        allFilter = allGenotype.transpose()
        dend = shc.dendrogram(shc.linkage(distance.pdist(
            allFilter, 'cityblock'), method='single'), no_plot=True)
        reordered_columns.extend(allFilter.index[dend["leaves"]])
    return reordered_columns


def reorder_rows(allGenotype, covariateMap):
    keys = list(covariateMap.keys())
    values1 = [int(x) for x in covariateMap[keys[0]]]
    genotype1 = allGenotype[values1]
    values2 = [int(x) for x in covariateMap[keys[1]]]
    genotype2 = allGenotype[values2]
    pvalues = []
    for rowIndex in range(allGenotype.shape[0]):
        stat, p = mannwhitneyu(
            genotype1.iloc[rowIndex], genotype2.iloc[rowIndex])
        pvalues.append((rowIndex, p))
    pvalues.sort(key=lambda x: x[1])
    reordered_rows = [pvalue[0] for pvalue in pvalues]
    return reordered_rows
