clear all;
close all;

x = rand(3,3)
n = ndims(x);
d = size(x);
fid = fopen('data.file', 'w');
if fid == -1, error('Cannot open file for writing'); end
fwrite(fid, n, 'double');
fwrite(fid, d, 'double');
fwrite(fid, x, 'double');
fclose(fid);