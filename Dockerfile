FROM python:3.7

RUN pip install numpy pandas flask uwsgi bokeh

RUN pip install cython
RUN apt-get update && apt-get install -y libboost-all-dev libgsl-dev libblosc-dev 

RUN wget http://www.hdfgroup.org/ftp/HDF5/current/src/hdf5-1.10.5.tar.gz \
 && tar -zxvf hdf5-1.10.5.tar.gz \
 && cd hdf5-1.10.5 \
 && ./configure --prefix=/usr/local --enable-build-mode=production --enable-threadsafe --disable-hl \
 && make -j4 \
 && make install \
 && make clean

RUN pip install h5py variant-tools

ENV LD_LIBRARY_PATH=$LD_LIBRARY_PATH:/usr/local/lib

# add user
RUN useradd -d /home/app vtools_user

COPY ./app /home/app
RUN mkdir /home/testProject/
RUN chown -R vtools_user /home/app/
RUN chown -R vtools_user /home/testProject/

ENV WORK_FOLDER=/home/
ENV PROJECT_FOLDER=/home/testProject/

# run as user
USER vtools_user

# download hg19 reference genome and refGene database
# RUN     mkdir /home/testProject/temp
# WORKDIR /home/testProject/temp
# RUN     touch temp.vcf
# RUN     vtools init test --build hg19
# RUN     vtools import temp.vcf
# RUN     vtools use refGene

WORKDIR /home/app
# Add "-i" to uwsgi to run in single-interpreter mode (to avoid reloading interpreter)
CMD uwsgi --socket 0.0.0.0:8087 --protocol=http --manage-script-name --mount /vtools=main:app


WORKDIR /home/bpeng
RUN     rm -rf temp


