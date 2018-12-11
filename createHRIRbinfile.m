function createHRIRbinfile(foldername,subjectNum)

row = 25;
col = 50;

filename = 'hrir_final.mat';
load(strcat(foldername,filename))

fid = fopen(strcat('hrir',subjectNum,'.file'), 'w');
if fid == -1, error('Cannot open file for writing'); end




for i = 1:row
    for j = 1:col
        fwrite(fid, squeeze(hrir_l(i,j,:)), 'double');
        fwrite(fid, squeeze(hrir_r(i,j,:)), 'double');
    end
end    

fclose(fid);

end