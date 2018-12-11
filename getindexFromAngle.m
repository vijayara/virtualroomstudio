function  [naz,nel] = getindexFromAngle(azim,el)
% Return the index from the given degree input.

if azim< -90 || azim > 90 || el> 270 || el < -90
    [naz,nel] = [-1,-1];
    return
end

% Find the indice of the elevation

elmax = 50;
elindices = 1:elmax;
elevations = -45 + 5.62*(elindices - 1);

nel =  round((el+45)/5.62 +1);
nel = max(nel,1);
nel = min(nel,elmax);


% Find the indice of the azimut
azimuts = [-80 -65 -55 -45:5:45 55 65 80];


% take the indice for which the difference is the smallest.

diff = azimuts-azim;

conv = pi/180.0;

angle = atan2(sin(diff*conv),cos(diff*conv))/conv; % degree

if angle < -90
    angle = angle + 360;
end

[minangle, naz] = min(abs(angle));



end