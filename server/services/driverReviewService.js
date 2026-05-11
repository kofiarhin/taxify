const DriverProfile = require('../models/DriverProfile');
const DriverReview = require('../models/DriverReview');

const refreshDriverRating = async (driverId) => {
  const [aggregate] = await DriverReview.aggregate([
    { $match: { driver: driverId } },
    {
      $group: {
        _id: '$driver',
        ratingAverage: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  await DriverProfile.findByIdAndUpdate(driverId, {
    ratingAverage: aggregate ? Number(aggregate.ratingAverage.toFixed(2)) : null,
    reviewCount: aggregate ? aggregate.reviewCount : 0
  });
};

module.exports = { refreshDriverRating };
