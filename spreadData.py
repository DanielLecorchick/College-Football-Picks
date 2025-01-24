#later on this will be used along with pointsCenter to get the spread data and then get the probability of of the underdog winning
#this data will then be used to caulauate underdogs point value. 
#favorite = basePoints
#underdog = basePoints * (favorite probability/underdog probability)
#then save this into the database


#this file utilizes cfp data dating back to 1980 until present day, given the chance a team at a given spread has a chance of winning
import numpy as np
import matplotlib.pyplot as plt
from scipy.optimize import curve_fit

#this fills in all of the x values being the point spread
x = np.array([0.0, -0.5, -1.0, -1.5, -2.0, -2.5, -3.0, -3.5, -4.0, -4.5, -5.0, -5.5, -6.0, 
              -6.5, -7.0, -7.5, -8.0, -8.5, -9.0, -9.5, -10.0, -10.5, -11.0, -11.5, -12.0, 
              -12.5, -13.0, -13.5, -14.0, -14.5, -15.0, -15.5, -16.0, -16.5, -17.0, -17.5, 
              -18.0, -18.5, -19.0, -19.5, -20.0, -20.5, -21.0, -21.5, -22.0, -22.5, -23.0, 
              -23.5, -24.0, -24.5, -25.0, -25.5, -26.0, -26.5, -27.0, -27.5, -28.0, -28.5, 
              -29.0, -29.5, -30.0, -30.5, -31.0, -31.5, -32.0, -32.5, -33.0
              ])

#this fills in all of the y values being the percent of times teams at a given spread have won
y = np.array([50.00, 50.00, 50.00, 49.18, 45.03, 44.39, 43.88, 37.50, 37.69, 36.10, 37.21, 32.68, 33.38, 
              32.21, 29.58, 26.72, 25.98, 29.29, 25.99, 21.34, 22.94, 24.18, 22.20, 22.48, 20.94,
              18.98, 19.76, 15.62, 14.26, 15.24, 15.25, 13.58, 12.23, 9.63, 10.12, 11.50, 8.42,
              9.26, 9.32, 11.52, 7.22, 6.13, 8.53, 5.35, 4.35, 4.65, 4.81, 3.57, 4.10, 4.67,
              4.91, 4.76, 2.60, 4.90, 2.41, 2.82, 3.21, 2.86, 3.70, 1.37, 0.76, 3.96, 2.94, 
              3.03, 0.00, 2.99, 1.22
])

#creates paired values
pairs = np.column_stack((x,y))

'''
#a quadratic function incase we wish to use that instead of exp
def quad_function(x, a, b, c):
    return a + b * x + c * x**2
'''
    
def exp_function(x, a, b, c):
    return a * np.exp(b * x) + c

#function to fit the non linear model:

popt, pcov = curve_fit(exp_function, x, y)

spread = -.5

def spreadFunction(spread, *popt):
    return exp_function(spread, *popt)


plt.scatter(x, y, label='Data')
plt.plot(x, exp_function(x, *popt), 'r-', label='Fit')
plt.legend()
plt.show()