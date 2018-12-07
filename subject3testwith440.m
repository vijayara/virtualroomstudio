clear all
close all


azim = -90;
elev = 0;

[x,fs] = audioread('440.wav');


%sound(y,fs)

%Load the hrtf of the subject number 3

hrtiffilename= 'hrir_final.mat';
load(hrtiffilename);


% Get the index for the angle 

[naz,nel] = getindexFromAngle(azim,elev);

h_L = squeeze(hrir_l(naz,nel,:));
h_R = squeeze(hrir_r(naz,nel,:));

y_l = filter(h_L,1,x(:,1));
y_r = filter(h_R,1,x(:,2));

y = [y_l y_r];

sound(y,fs);





