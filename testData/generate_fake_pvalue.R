#FAKE SAMPLE DATA
createSampleGwasData<-function(chr.count=10, include.X=F) {
		chr<-c(); pos<-c()
	for(i in 1:chr.count) {
				chr <- c(chr,rep(i, 1000))
			pos <- c(pos,ceiling(runif(1000)*(chr.count-i+1)*25*1e3))
				}
		if(include.X) {
					chr <- c(chr,rep("X", 1000))
				pos <- c(pos,ceiling(runif(1000)*5*25*1e3))
					}
			pvalue <- runif(length(pos))
				return(data.frame(chr, pos,pvalue))
}
dd<-createSampleGwasData()
dd$pvalue[3000] <- 1e-7 #include a significant result
write.table(dd,file="fake_pvalue.tsv",quote=FALSE,sep='\t',col.names=NA)
